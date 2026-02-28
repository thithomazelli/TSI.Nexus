using System.Linq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class ProductService : IProductService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Product registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Product> _repository;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// ProductService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Product> object used to initialize the internal variable using Dependency Injection.</param>
        public ProductService(IRepository<Product> repository)
        {
            _repository = repository;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Product>> Add(Product product)
        {
            WebApiResponse<Product> result = new();

            try
            {
                var productDuplicatedMessage = await CheckIfProductIsDuplicatedAndGetErrorMessage(
                    product
                );

                if (!string.IsNullOrEmpty(productDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = productDuplicatedMessage;
                    return result;
                }

                await _repository.AddAsync(product);

                result.Data = product;
                result.Status = ResponseStatus.Success;
                result.Message = $"Produto {product.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Produto {product.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Product>> Update(Product product)
        {
            WebApiResponse<Product> result = new();

            try
            {
                var productDuplicatedMessage = await CheckIfProductIsDuplicatedAndGetErrorMessage(
                    product
                );

                if (!string.IsNullOrEmpty(productDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = productDuplicatedMessage;
                    return result;
                }

                await _repository.UpdateAsync(product);

                result.Data = product;
                result.Status = ResponseStatus.Success;
                result.Message = $"Produto {product.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Produto {product.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Product>> Remove(Product product)
        {
            WebApiResponse<Product> result = new();

            try
            {
                await _repository.RemoveAsync(product);

                result.Data = product;
                result.Status = ResponseStatus.Success;
                result.Message = $"Produto {product.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Produto {product.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<Product>>> FindAll()
        {
            WebApiResponse<IEnumerable<Product>> result = new();

            try
            {
                result.Data = await _repository.GetAllAsync();
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Product>> FindById(Guid? id)
        {
            WebApiResponse<Product> result = new();

            try
            {
                result.Data = await _repository.GetByIdAsync(id);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Produto {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Produto com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Product>> FindBySku(string sku)
        {
            WebApiResponse<Product> result = new();

            try
            {
                result.Data = await _repository.FirstOrDefaultAsync(_ => _.Sku.Equals(sku));
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Produto {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Produto com Sku {sku} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Product is already being registered on the database.
        /// </summary>
        /// <param name="product">The Product object that is being added or updated.</param>
        /// <returns>The error message when Product is duplicated. Otherwise an empty string.</returns>
        private async Task<string> CheckIfProductIsDuplicatedAndGetErrorMessage(Product product)
        {
            if (await IsNameDuplicated(product))
            {
                return $"Já existe um Produto cadastrado com Nome {product.Name}.";
            }

            if (await IsSkuDuplicated(product))
            {
                return $"Já existe um Produto cadastrado com Sku {product.Sku}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Product name is already being used by another register on the database.
        /// </summary>
        /// <param name="product">The Product object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private Task<bool> IsNameDuplicated(Product product)
        {
            return _repository.AnyAsync(_ => _.Id != product.Id && _.Name == product.Name);
        }

        /// <summary>
        /// Should verify if the Product sku is already being used by another register on the database.
        /// </summary>
        /// <param name="product">The Product object that is being added or updated.</param>
        /// <returns>True when the sku is duplicated; Otherwise false.</returns>
        private Task<bool> IsSkuDuplicated(Product product)
        {
            return _repository.AnyAsync(_ =>
                _.Id != product.Id && !string.IsNullOrEmpty(_.Sku) && _.Sku == product.Sku
            );
        }

        #endregion Private methods
    }
}

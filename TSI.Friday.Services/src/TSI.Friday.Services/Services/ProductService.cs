using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utitlities;

namespace TSI.Friday.Services.Services
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
        public WebApiResponse<Product> Add(Product product)
        {
            WebApiResponse<Product> result = new();

            try
            {
                var productDuplicatedMessage = CheckIfProductIsDuplicatedAndGetErrorMessage(product);

                if (!string.IsNullOrEmpty(productDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = productDuplicatedMessage;
                    return result;
                }

                _repository.Add(product);

                result.Data = product;
                result.Status = ResponseStatus.Success;
                result.Message = $"Produto {product.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível cadastrar o Produto {product.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Product> Update(Product product)
        {
            WebApiResponse<Product> result = new();

            try
            {
                var ProductDuplicatedMessage = CheckIfProductIsDuplicatedAndGetErrorMessage(product);

                if (!string.IsNullOrEmpty(ProductDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = ProductDuplicatedMessage;
                    return result;
                }

                _repository.Update(product);

                result.Data = product;
                result.Status = ResponseStatus.Success;
                result.Message = $"Produto {product.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar os dados do Produto {product.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Product> Remove(Product product)
        {
            WebApiResponse<Product> result = new();

            try
            {
                _repository.Remove(product);

                result.Data = product;
                result.Status = ResponseStatus.Success;
                result.Message = $"Produto {product.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível remover o Produto {product.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<IEnumerable<Product>> FindAll()
        {
            WebApiResponse<IEnumerable<Product>> result = new();

            try
            {
                result.Data = _repository.GetAll();
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Product> FindById(int? id)
        {
            WebApiResponse<Product> result = new();

            try
            {
                result.Data = _repository.GetById(id);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Produto {result.Data.Name} encontrado com sucesso"
                    : $"Nenhum Produto com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Product> FindBySku(string sku)
        {
            WebApiResponse<Product> result = new();

            try
            {
                result.Data = _repository.Query(_ => _.Sku.Contains(sku))?.FirstOrDefault();
                result.Status = ResponseStatus.Success; result.Message = result.Data != null
                    ? $"Produto {result.Data.Name} encontrado com sucesso"
                    : $"Nenhum Produto com Sku {sku} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Produtos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Product is already being registered on the database.
        /// </summary>
        /// <param name="Product">The Product object that is being added or updated.</param>
        /// <returns>The error message when Product is duplicated. Otherwise an empty string.</returns>
        private string CheckIfProductIsDuplicatedAndGetErrorMessage(Product Product)
        {
            if (IsNameDuplicated(Product))
            {
                return $"Já existe um Produto cadastrado com Nome {Product.Name}.";
            }

            if (IsSkuDuplicated(Product))
            {
                return $"Já existe um Produto cadastrado com Sku {Product.Sku}.";
            }


            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Product name is already being used by another register on the database.
        /// </summary>
        /// <param name="Product">The Product object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private bool IsNameDuplicated(Product Product)
        {
            return _repository
                .Query(_ => _.Id != Product.Id && _.Name == Product.Name)
                .Any();
        }

        /// <summary>
        /// Should verify if the Product sku is already being used by another register on the database.
        /// </summary>
        /// <param name="Product">The Product object that is being added or updated.</param>
        /// <returns>True when the sku is duplicated; Otherwise false.</returns>
        private bool IsSkuDuplicated(Product Product)
        {
            return _repository
                .Query(_ => _.Id != Product.Id && !string.IsNullOrEmpty(_.Sku) && _.Sku == Product.Sku)
                .Any();
        }

        #endregion Private methods
    }
}
